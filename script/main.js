// Template selection functionality
document.addEventListener('DOMContentLoaded', function () {
  const templateSelect = document.getElementById('template')
  const continueButton = document.querySelector('.select-button')

  // Get template from URL parameters if available
  const urlParams = new URLSearchParams(window.location.search)
  const urlTemplate = urlParams.get('template')

  if (urlTemplate && templateSelect) {
    templateSelect.value = urlTemplate
  }

  if (templateSelect) {
    templateSelect.addEventListener('change', function () {
      const selectedTemplate = this.value
      localStorage.setItem('selectedTemplate', selectedTemplate)
      console.log(`Template ${selectedTemplate} saved to localStorage`)
    })
  }

  // Ensure template is saved even if user doesn't change selection
  if (continueButton) {
    continueButton.addEventListener('click', function (e) {
      if (templateSelect) {
        const selectedTemplate = templateSelect.value
        localStorage.setItem('selectedTemplate', selectedTemplate)
        console.log(
          `Template ${selectedTemplate} saved to localStorage on continue`
        )

        // Update the href to include the template parameter
        const link = continueButton.querySelector('a')
        if (link) {
          e.preventDefault()
          window.location.href = `/pages/game.html?template=${selectedTemplate}`
        }
      }
    })
  }
})
